import React from 'react';

const ChipIcon = ({ color = '#F18F01', width = 47, height = 46 }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 47 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_d)">
      <circle
        cx="23.5014"
        cy="19.5016"
        r="19.5016"
        transform="rotate(90 23.5014 19.5016)"
        fill={color}
      />
      <circle
        cx="23.5014"
        cy="19.5016"
        r="19.1125"
        transform="rotate(90 23.5014 19.5016)"
        stroke={color}
        strokeWidth="0.778208"
      />
    </g>
    <g filter="url(#filter1_d)">
      <circle
        cx="24.1739"
        cy="20.1747"
        r="12.1044"
        transform="rotate(90 24.1739 20.1747)"
        fill={color}
      />
      <circle
        cx="24.1739"
        cy="20.1747"
        r="11.7153"
        transform="rotate(90 24.1739 20.1747)"
        stroke={color}
        strokeWidth="0.778208"
      />
    </g>
    <defs>
      <filter
        id="filter0_d"
        x="0.88717"
        y="0"
        width="45.2286"
        height="45.2286"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="3.11283" />
        <feGaussianBlur stdDeviation="1.55642" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow"
        />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
      </filter>
      <filter
        id="filter1_d"
        x="8.95651"
        y="8.07031"
        width="30.4346"
        height="30.4346"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="3.11283" />
        <feGaussianBlur stdDeviation="1.55642" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow"
        />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
      </filter>
    </defs>
  </svg>
);

export default ChipIcon;
