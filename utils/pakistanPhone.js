/** Pakistan mobile: +92 3XX XXXXXXX (10 digits after country code, starts with 3). */
export const PK_LOCAL_LENGTH = 10;

export const formatPkLocalDigits = (input) => {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length > 2) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length > 0 && digits[0] !== '3') {
    digits = `3${digits}`.slice(0, PK_LOCAL_LENGTH);
  }
  return digits.slice(0, PK_LOCAL_LENGTH);
};

export const isValidPkLocalPhone = (localDigits) =>
  /^3\d{9}$/.test(String(localDigits || ''));

export const toE164FromLocal = (localDigits) => {
  const local = formatPkLocalDigits(localDigits);
  if (!local) return '';
  return `+92${local}`;
};
