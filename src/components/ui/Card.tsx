import { HTMLAttributes } from 'react';

function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-card border border-gray-200 bg-white p-5 ${className}`} {...rest} />;
}

export default Card;
