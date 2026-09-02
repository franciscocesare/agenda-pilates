import React from 'react';

export const InstagramIcon = ({ size = 24, color = "#E1306C", ...props }) => {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke={color} // El color se aplica a las líneas
      strokeWidth="2" // Grosor de la línea
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://w3.org"
      {...props}
    >
      <title>Instagram</title>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
};
