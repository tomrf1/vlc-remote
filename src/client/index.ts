import * as React from 'react';
import { createRoot } from "react-dom/client";
import './style.css';
import Videos from './Videos';

const container = document.getElementById('root');

const e = React.createElement(Videos)
if (container) {
  const root = createRoot(container);
  root.render(e);
}
