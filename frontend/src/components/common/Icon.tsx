import React from 'react';

interface IconProps {
  name: string;
  size?: number | string;
  className?: string;
  stroke?: string;
  fill?: string;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 20, 
  className, 
  stroke = 'currentColor',
  fill = 'none'
}) => {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{
        stroke,
        fill,
        strokeWidth: 2,
      }}
    >
      <use href={`/src/assets/icons/${name}.svg#${name}`} />
    </svg>
  );
};

export default Icon;
