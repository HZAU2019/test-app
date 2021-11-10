import { HashRouter, BrowserRouter,Route ,Switch} from "react-router-dom";
//import { Switch } from "react-router";
import HomeDemo from "./homeTest";
import JiahaoAge from "./jiahaoAge";
import JiahaoDemo from "./jiahaoTest";
import WenboAge from "./wenboAge";
import WenboDemo from "./wenboTest";


function RouteDemo(){
    console.log('走到这里了')
    return(
        <BrowserRouter>
            <Switch>
                <Route exact path='/' component={HomeDemo}/>
                <Route exact path='/wenbo' component={WenboDemo}/>
                <Route exact path='/jiahao' component={JiahaoDemo}/>
                <Route  exact path='/wenbo/age' component={WenboAge}/>
                <Route exact path='/jiahao/age' component={JiahaoAge}/>
                </Switch>
        </BrowserRouter>
    )
}
export default RouteDemo