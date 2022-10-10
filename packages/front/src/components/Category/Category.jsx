import React from 'react';
import Texture from '../Texture/Texture';
import { titleize } from '../../helpers/text';
import './Category.scss';

const Category = ({ category }) =>
<div className="category">
  <h3>{titleize(category.name)}</h3>
  <div className="category__texture">
    {category.textures.map((t) => <Texture texture={t} key={`${category.name}-${t.name}`} />)}
  </div>
</div>;

Category.displayName = 'Category';
export default Category;
