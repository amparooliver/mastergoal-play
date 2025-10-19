const GoalkeeperIcon = ({ color = '#F18F01', width = '100%', height = '100%' }) => {
  return (
    <div style={{
      width,
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 47 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.25))',
          transform: 'scale(1.15)' // Make goalkeeper 15% bigger to show arm reach
        }}
      >
        <g>
          <circle cx="23.5014" cy="38.5021" r="19.5016" transform="rotate(90 23.5014 38.5021)" fill={color}/>
          <circle cx="23.5014" cy="38.5021" r="19.1125" transform="rotate(90 23.5014 38.5021)" stroke={color} strokeWidth="0.778208"/>
        </g>
        <g>
          <ellipse cx="24.499" cy="38.5" rx="38.5" ry="7.5" transform="rotate(90 24.499 38.5)" fill={color}/>
          <path d="M31.6103 38.5C31.6103 49.1143 30.7711 58.7134 29.4199 65.6494C28.7438 69.1203 27.9437 71.9045 27.0654 73.8115C26.6257 74.7662 26.1754 75.4798 25.7285 75.9492C25.2818 76.4185 24.8714 76.6113 24.499 76.6113C24.1266 76.6113 23.7163 76.4185 23.2695 75.9492C22.8227 75.4798 22.3733 74.7661 21.9336 73.8115C21.0553 71.9045 20.2543 69.1205 19.5781 65.6494C18.227 58.7134 17.3877 49.1143 17.3877 38.5C17.3877 27.8857 18.227 18.2866 19.5781 11.3506C20.2543 7.87952 21.0553 5.09551 21.9336 3.18848C22.3733 2.23386 22.8227 1.52021 23.2695 1.05078C23.7163 0.581491 24.1266 0.388672 24.499 0.388672C24.8714 0.388672 25.2818 0.58149 25.7285 1.05078C26.1754 1.52022 26.6258 2.23384 27.0654 3.18848C27.9437 5.0955 28.7438 7.87973 29.4199 11.3506C30.7711 18.2866 31.6104 27.8857 31.6103 38.5Z" stroke={color} strokeWidth="0.778208"/>
        </g>
        <g>
          <circle cx="24.1739" cy="39.1753" r="12.1044" transform="rotate(90 24.1739 39.1753)" fill={color}/>
          <circle cx="24.1739" cy="39.1753" r="11.7153" transform="rotate(90 24.1739 39.1753)" stroke={color} strokeWidth="0.778208"/>
        </g>
      </svg>
    </div>
  );
};

export default GoalkeeperIcon;
