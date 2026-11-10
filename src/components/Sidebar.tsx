import { Link } from "react-router-dom";

import "./Sidebar.css";


const menuItems = [

{
name:"Dashboard",
path:"/"
},

{
name:"Daily Tasks",
path:"/daily"
},

{
name:"Project",
path:"/Projects"
},

{
name:"Create Task",
path:"/tasks"
},

{
name:"Calendar",
path:"/calendar"
},

{
name:"Settings",
path:"/settings"
}

];


export default function Sidebar(){

return (

<aside className="sidebar">


<h2>
Protocol Tracker
</h2>


<nav>

{
menuItems.map((item)=>(

<Link

key={item.name}

to={item.path}

className="sidebar-item"

>

{item.name}

</Link>

))
}


</nav>


<div className="sidebar-footer">

Version 2.0

</div>


</aside>

)

}