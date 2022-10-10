import React from 'react';
import './Tooltip.scss';

const Tooltip = ({ name, author, choice, telethon }) => {
  const nameClass = 'tooltip__name' + (telethon ? ' tooltip__telethon' : '');
  return <div className="tooltip">
    <h4 className={nameClass}>{name}</h4>
    <h5 className="tooltip__author">By {author}</h5>
    <h5 className="tooltip__choice">{choice}</h5>
  </div>;
};

Tooltip.displayName = 'Tooltip';
export default Tooltip;

export const getContent = (dataTip) => {
  if (!dataTip) {
    return null;
  }
  const option = JSON.parse(dataTip);
  if (!option) {
    return null;
  }
  console.log(option);
  return <Tooltip {...option} />;
};
