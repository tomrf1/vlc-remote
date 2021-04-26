import * as React from 'react';
import * as ReactDOM from "react-dom";
import './style.css';
import Videos from './videos';

const container = document.getElementById('root');

const e = React.createElement(Videos)
ReactDOM.render(e, container);
