/* eslint-disable no-nested-ternary */
export const displayDate = (dateValue) => {
  if (!dateValue) return '';

  let date;

  // case 1: number (timestamp milliseconds)
  if (typeof dateValue === 'number') {
    date = new Date(dateValue);
  }

  // case 2: Firebase Timestamp
  else if (dateValue.seconds) {
    date = new Date(dateValue.seconds * 1000);
  }

  // fallback
  else {
    date = new Date(dateValue);
  }

  if (Number.isNaN(date.getTime())) return '';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};


export const displayMoney = (n) => {
  // 👉 SỬA Ở ĐÂY: bỏ USD, bỏ .00
  return new Intl.NumberFormat('vi-VN').format(n);
};

export const calculateTotal = (arr) => {
  if (!arr || arr?.length === 0) return 0;

  const total = arr.reduce((acc, val) => acc + val, 0);

  // 👉 Nếu tổng tiền cũng không muốn .00
  return total;
};

export const displayActionMessage = (msg, status = 'info') => {
  const div = document.createElement('div');
  const span = document.createElement('span');

  div.className = `toast ${status === 'info'
    ? 'toast-info'
    : status === 'success'
      ? 'toast-success'
      : 'toast-error'
  }`;

  span.className = 'toast-msg';
  span.textContent = msg;
  div.appendChild(span);

  if (document.querySelector('.toast')) {
    document.body.removeChild(document.querySelector('.toast'));
    document.body.appendChild(div);
  } else {
    document.body.appendChild(div);
  }

  setTimeout(() => {
    try {
      document.body.removeChild(div);
    } catch (e) {
      console.log(e);
    }
  }, 3000);
};
