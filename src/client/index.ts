import * as React from 'react';
import ReactDOM from "react-dom";
import './style.css';
import Page from './page';

const container = document.getElementById('root');

const e = React.createElement(Page)
ReactDOM.render(e, container);
