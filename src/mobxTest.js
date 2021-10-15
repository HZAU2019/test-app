import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

const MobxTest = observer(function({mobxData}){
    console.log('来啦老弟')
    console.log(mobxData.age+'阿里巴巴')
    console.log(mobxData.emotion)
    //let {name,age,weight,tall,address} = props.data
    function add(){
       // mobxData.age =  mobxData.age +1
        mobxData.emotion.smile = '嘿嘿嘿'
    }

    return(
        <div>
            <h3>哈撒给</h3>
            <button onClick={add}>加一</button>
        </div>
    )

})

export default MobxTest

