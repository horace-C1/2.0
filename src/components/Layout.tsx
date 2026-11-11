import Sidebar from "./Sidebar";
import "../style/pages.css";


export default function Layout(
{
  children
}: 
{
  children: React.ReactNode
}){


return (

<div className="app-layout">

    <Sidebar/>

    <main className="main-content">

        {children}

    </main>


</div>

)

}
