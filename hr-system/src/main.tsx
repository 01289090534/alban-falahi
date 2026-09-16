import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import './styles.css';
import logoData from './assets/logoData';

const icon=document.querySelector<HTMLLinkElement>('link[rel="icon"]')||document.createElement('link');
icon.rel='icon';icon.href=logoData;document.head.appendChild(icon);

document.documentElement.dir='rtl';
document.documentElement.lang='ar';

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}

createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
