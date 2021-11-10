import React,{useEffect} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import MobxTest from './mobxTest';
import { observable } from 'mobx';
import HookTest from './hookTest';
import RouteDemo from './reactRouter/reactTest';

var mobxData = observable({
  name:'刘温伯',
  age:25,
  weight:85,
  tall:176,
  address:'川杨新苑',
  emotion:{
    cry:'嘤嘤嘤',
    smile:'哈哈哈'
  }
 
})


ReactDOM.render(
  
    <HookTest mobxData = {mobxData}/>
 ,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
