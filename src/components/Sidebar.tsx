import { NavLink } from "react-router-dom";

import "./Sidebar.css";


const menuItems = [

{
name:"Dashboard",
path:"/",
mobileName:"Home"
},

{
name:"Daily Tasks",
path:"/daily",
mobileName:"Daily"
},

{
name:"Project",
path:"/Projects",
mobileName:"Projects"
},

{
name:"Create Task",
path:"/tasks",
mobileName:"New"
},

{
name:"Calendar",
path:"/calendar",
mobileName:"Calendar"
},

{
name:"Settings",
path:"/settings",
mobileName:"Settings"
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

<NavLink

key={item.name}

to={item.path}
end={item.path === "/"}
className={({ isActive }) => `sidebar-item${isActive ? " active" : ""}`}
aria-label={item.name}

>

<span className="sidebar-item-label">{item.name}</span>
<span className="sidebar-item-mobile-label" aria-hidden="true">
  {item.mobileName}
</span>

</NavLink>

))
}


</nav>


<div className="sidebar-footer">

Version 2.0

</div>


</aside>

)

}
