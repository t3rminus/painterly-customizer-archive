import React, { useContext } from 'react';
import { AppSettingsContext } from '../../contexts/AppSettingsContext';
import { titleize } from '../../helpers/text';
import './Texture.scss';

const Texture = ({ texture }) => {
  const { appSettings } = useContext(AppSettingsContext);

  return <div className="texture">
    <h4 className="texture__heading">{titleize(texture.name)}</h4>
    <ul className="texture__options">
      {texture.options.map(o =>
      <li className="texture__option" key={o.id}>
        <label className="texture__label" data-tip={JSON.stringify(o)}>
          <input type="radio" name="test" />
          <img src={`${appSettings.base_url}/${o.preview}`} className="texture__image" />
        </label>
      </li>
      )}
    </ul>
  </div>;
};

Texture.displayName = 'Texture';
export default Texture;
