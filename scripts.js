(() => {
  'use strict';

  const STORAGE_KEY = 'user_form_data_v1';

  const $ = (selector) => document.querySelector(selector);

  const form = $('#user_form');
  const statusMessage = $('#status_message');

  const fields = {
    first_name: $('#first_name'),
    last_name: $('#last_name'),
    email: $('#email'),
    phone: $('#phone'),
    zip_code: $('#zip_code'),
    address_line1: $('#address_line1'),
    address_number: $('#address_number'),
    address_complement: $('#address_complement'),
    district: $('#district'),
    city: $('#city'),
    state: $('#state'),
  };

  // Helpers (format/normalize)
  const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

  const normalizeZipCode = (value) => onlyDigits(value).slice(0, 8);

  const formatZipCode = (digits) => {
    const d = normalizeZipCode(digits);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  };

  const normalizePhone = (value) => onlyDigits(value).slice(0, 11);

  const formatPhoneBR = (digits) => {
    const d = normalizePhone(digits);

    // (AA) NNNN-NNNN  -> 10 dígitos
    // (AA) NNNNN-NNNN -> 11 dígitos
    if (d.length === 0) return '';
    if (d.length < 3) return `(${d}`;
    if (d.length < 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;

    if (d.length <= 10) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    }
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const normalizeState = (value) =>
    String(value || '')
      .trim()
      .toUpperCase()
      .slice(0, 2);

  // UI status
  const showStatus = (type, message) => {
    statusMessage.classList.remove(
      'status--hidden',
      'status--success',
      'status--error',
    );
    if (type === 'success') statusMessage.classList.add('status--success');
    if (type === 'error') statusMessage.classList.add('status--error');
    statusMessage.textContent = message;
  };

  const hideStatus = () => {
    statusMessage.classList.add('status--hidden');
    statusMessage.textContent = '';
    statusMessage.classList.remove('status--success', 'status--error');
  };

  // Storage
  const getFormDataObject = () => {
    const data = {};
    Object.keys(fields).forEach((key) => {
      data[key] = fields[key].value ?? '';
    });
    return data;
  };

  const setFormDataObject = (data) => {
    if (!data || typeof data !== 'object') return;
    Object.keys(fields).forEach((key) => {
      if (typeof data[key] === 'string') fields[key].value = data[key];
    });
  };

  const saveToStorage = () => {
    const data = getFormDataObject();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const loadFromStorage = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setFormDataObject(data);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearStorageAndForm = () => {
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    hideStatus();
    showStatus('success', 'Dados salvos removidos com sucesso.');
  };

  // ViaCEP
  const viacepFetch = async (zipDigits) => {
    const zip = normalizeZipCode(zipDigits);
    const url = `https://viacep.com.br/ws/${zip}/json/`;

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) throw new Error('Falha ao consultar o ViaCEP.');
    return response.json();
  };

  const fillAddressFromViaCep = (payload) => {
    if (!payload || payload.erro) return false;

    if (payload.logradouro) fields.address_line1.value = payload.logradouro;
    if (payload.bairro) fields.district.value = payload.bairro;
    if (payload.localidade) fields.city.value = payload.localidade;
    if (payload.uf) fields.state.value = normalizeState(payload.uf);

    if (payload.complemento && !fields.address_complement.value) {
      fields.address_complement.value = payload.complemento;
    }

    return true;
  };

  // Validations (extra)
  const isValidName = (value) => {
    const v = String(value || '').trim();
    return v.length >= 2;
  };

  const isValidEmailSimple = (value) => {
    const v = String(value || '').trim();
    // Simples e suficiente para "extra validation" sem exagerar
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const isValidStateUF = (value) => {
    const v = normalizeState(value);
    return /^[A-Z]{2}$/.test(v);
  };

  const isValidZip = (value) => normalizeZipCode(value).length === 8;

  const isValidPhoneIfFilled = (value) => {
    const d = normalizePhone(value);
    if (d.length === 0) return true; // opcional
    return d.length === 10 || d.length === 11;
  };

  const validateFormExtra = () => {
    const errors = [];

    if (!isValidName(fields.first_name.value))
      errors.push('Nome deve ter pelo menos 2 caracteres.');
    if (!isValidName(fields.last_name.value))
      errors.push('Sobrenome deve ter pelo menos 2 caracteres.');

    if (!isValidEmailSimple(fields.email.value))
      errors.push('E-mail inválido. Verifique o formato.');

    if (!isValidZip(fields.zip_code.value))
      errors.push('CEP inválido. Digite 8 números.');

    fields.state.value = normalizeState(fields.state.value);
    if (!isValidStateUF(fields.state.value))
      errors.push('UF inválida. Use 2 letras (ex.: SP).');

    if (!isValidPhoneIfFilled(fields.phone.value)) {
      errors.push('Telefone inválido. Use 10 ou 11 dígitos (com DDD).');
    }

    return errors;
  };

  // Handlers
  const handleZipCodeInput = async () => {
    hideStatus();

    const zipDigits = normalizeZipCode(fields.zip_code.value);
    fields.zip_code.value = formatZipCode(zipDigits);

    saveToStorage();

    if (zipDigits.length < 8) return;

    try {
      showStatus('success', 'Consultando CEP...');
      const payload = await viacepFetch(zipDigits);

      if (payload.erro) {
        showStatus('error', 'CEP não encontrado. Verifique e tente novamente.');
        saveToStorage();
        return;
      }

      const filled = fillAddressFromViaCep(payload);
      if (filled) showStatus('success', 'Endereço preenchido automaticamente.');
      saveToStorage();
    } catch (err) {
      console.log(err);
      showStatus(
        'error',
        'Não foi possível consultar o CEP agora. Tente novamente.',
      );
      saveToStorage();
    }
  };

  const handlePhoneInput = () => {
    const digits = normalizePhone(fields.phone.value);
    fields.phone.value = formatPhoneBR(digits);
    saveToStorage();
  };

  const handleStateInput = () => {
    fields.state.value = normalizeState(fields.state.value);
    saveToStorage();
  };

  const onFormSubmit = (event) => {
    event.preventDefault();
    hideStatus();

    // HTML5 validation (required/email)
    const htmlValid = form.checkValidity();
    if (!htmlValid) {
      form.reportValidity();
      return;
    }

    // Extra validations
    const errors = validateFormExtra();
    if (errors.length) {
      showStatus('error', errors[0]);
      return;
    }

    saveToStorage();
    showStatus('success', 'Cadastro salvo no navegador com sucesso.');
  };

  const onAnyFieldInput = (event) => {
    const id = event.target?.id;
    if (id === 'zip_code' || id === 'phone' || id === 'state') return;
    saveToStorage();
  };

  // Init
  const init = () => {
    loadFromStorage();

    // Reaplica máscaras/formatações ao carregar
    fields.zip_code.value = formatZipCode(fields.zip_code.value);
    fields.phone.value = formatPhoneBR(fields.phone.value);
    fields.state.value = normalizeState(fields.state.value);

    // Se já carregou com CEP completo e endereço incompleto, tenta preencher
    const zipDigits = normalizeZipCode(fields.zip_code.value);
    if (
      zipDigits.length === 8 &&
      (!fields.address_line1.value || !fields.city.value || !fields.state.value)
    ) {
      handleZipCodeInput();
    }

    $('#clear_button').addEventListener('click', clearStorageAndForm);
    form.addEventListener('submit', onFormSubmit);

    Object.values(fields).forEach((input) => {
      input.addEventListener('input', onAnyFieldInput);
    });

    // CEP com debounce
    fields.zip_code.addEventListener('input', () => {
      window.clearTimeout(fields.zip_code._t);
      fields.zip_code._t = window.setTimeout(handleZipCodeInput, 450);
    });

    // Máscara telefone
    fields.phone.addEventListener('input', handlePhoneInput);

    // UF sempre em maiúsculo
    fields.state.addEventListener('input', handleStateInput);
  };

  window.addEventListener('DOMContentLoaded', init);
})();
