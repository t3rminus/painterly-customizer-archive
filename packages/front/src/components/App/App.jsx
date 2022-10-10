import React, { useState, useEffect } from 'react';
import ReactTooltip from 'react-tooltip';
import { getContent } from '../Tooltip/Tooltip';
import { get } from '../../helpers/fetch';
import Header from '../Header/Header';
import Category from '../Category/Category';
import './App.scss';

function App() {
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    (async () => {
      setGroups(await get('/api/textures'));
      ReactTooltip.rebuild();
    })();
  }, []);
  return (
    <div className="app">
      <Header />
      <div className="app__content">
        {groups.map(g =>
          <div key={g.name}>
            {g.categories.map(c => <Category category={c} key={c.name} />)}
          </div>)}
        <ReactTooltip place="bottom" effect="solid" getContent={getContent} />
      </div>
    </div>
  );
}

export default App;
