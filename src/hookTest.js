import { observer } from 'mobx-react'
import React, { useState ,useEffect} from 'react'

const HookTest = observer(
    function(props) {
        let a = props.mobxData
       // let b = props.mobxData
        const [name,setName] = useState('wenbo')
        const [age,setAge] = useState(25)
        // useEffect(() => {
        //    //setName('jiahao')
        //    //props.mobxData.name = 'hasaki'
        //   // a.name = 'yiku'
        //    //props.mobxData.name = 'has'
        //    //b.name = 'has'

        //    //console.log("修改了名字")
        //    //a.address = '河南'
        //   // a.weight = '100'
        //    //setAge(26)
        //    //setName('jjjjjj')
        //   // setName('yuanjun')
        //    console.log('修改了年龄')
        // })
        console.log("----执行了"+age)
       // a.weight = '100'
       // setName('jjjjjj')
        console.log(a.address)
        return (
            <div>
                <h3>这个人的名字是：{name}</h3>
                <h3>这个人的年龄是：{age}</h3> 
                <h3>另一个人的名字是：{a.address}</h3>   
                <h3>另一个人重：{a.weight}</h3>  
            </div>
        )
    }
) 

export default HookTest
