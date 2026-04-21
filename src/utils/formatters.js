// src/utils/formatters.js

// This formatter shows '₱' (PHP 0,000)
export const formatPHP = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0, // Set to 2 if you want cents (.00)
  }).format(amount);
};