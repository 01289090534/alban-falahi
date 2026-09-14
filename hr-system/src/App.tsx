import {useEffect,useState} from 'react';
import {Navigate,Route,Routes,useLocation} from 'react-router-dom';
import type {ReactElement} from 'react';
import type {Profile} from './types';
import {supabase} from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeReview from './pages/EmployeeReview';
import EmployeeRanking from './pages/EmployeeRanking';
import Branches from './pages/Branches';
import Attendance from './pages/Attendance';
import Closeouts from './pages/Closeouts';
import Overtime from './pages/Overtime';
import Money from './pages/Money';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Layout from './components/Layout';
const accountantOnly=(profile:Profile,element:ReactElement)=>(profile.role==='accountant'?<Navigate to="/attendance" replace/>:element);
function ProtectedApp({profile}:{profile:Profile}){return <Routes><Route element={<Layout profile={profile}/>}><Route index element={profile.role==='accountant'?<Navigate to="/attendance" replace/>:<Dashboard profile={profile}/>}/><Route path="employees" element={accountantOnly(profile,<Employees/>)}/><Route path="employee-review" element={accountantOnly(profile,<EmployeeReview/>)}/><Route path="employee-ranking" element={accountantOnly(profile,<EmployeeRanking/>)}/><Route path="branches" element={accountantOnly(profile,<Branches/>)}/><Route path="attendance" element={<Attendance/>}/><Route path="closeouts" element={<Closeouts profile={profile}/>}/><Route path="overtime" element={accountantOnly(profile,<Overtime profile={profile}/>)}/><Route path="money" element={<Money profile={profile}/>}/><Route path="payroll" element={<Payroll profile={profile}/>}/><Route path="reports" element={accountantOnly(profile,<Reports/>)}/><Route path="notifications" element={accountantOnly(profile,<Notifications/>)}/><Route path="users" element={accountantOnly(profile,<Users/>)}/><Route path="settings" element={accountantOnly(profile,<Settings profile={profile}/> )}/></Route><Route path="*" element={<Navigate to={profile.role==='accountant'?'/attendance':'/'} replace/>}/></Routes>}
export default function App(){const location=useLocation();const[userId,setUserId]=useState<string|null>(null);const[profile,setProfile]=useState<Profile|null>(null);const[checking,setChecking]=useState(true);const[profileError,setProfileError]=useState('');useEffect(()=>{let alive=true;const finish=(id:string|null)=>{if(!alive)return;setUserId(id);setChecking(false)};async function restoreSession(){try{const{data,error}=await supabase.auth.getSession();if(!alive)return;if(error){finish(null);return}if(data.session?.user?.id){const{data:userData,error:userError}=await supabase.auth.getUser();if(!alive)return;if(!userError&&userData.user){finish(userData.user.id);return}}finish(null)}catch{finish(null)}}void restoreSession();const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>finish(session?.user?.id||null));return()=>{alive=false;subscription.unsubscribe()}},[]);useEffect(()=>{if(!userId){setProfile(null);setProfileError('');return}let alive=true;const timer=window.setTimeout(()=>{if(alive){setProfileError('تعذر تحميل الحساب مؤقتًا.');setProfile(null)}},8000);async function loadProfile(){try{const{data,error}=await supabase.rpc('hr_v2_get_my_profile');if(!alive)return;window.clearTimeout(timer);if(error||!data?.id){setProfileError('تعذر تحميل بيانات المستخدم.');setProfile(null);return}setProfile(data as Profile)}catch{if(alive){window.clearTimeout(timer);setProfileError('تعذر تحميل بيانات المستخدم.');setProfile(null)}}}void loadProfile();return()=>{alive=false;window.clearTimeout(timer)}},[userId]);useEffect(()=>{const refresh=async()=>{if(document.visibilityState!=='visible')return;try{await supabase.auth.getSession()}catch{}};document.addEventListener('visibilitychange',refresh);window.addEventListener('focus',refresh);return()=>{document.removeEventListener('visibilitychange',refresh);window.removeEventListener('focus',refresh)}},[]);if(location.pathname==='/login')return <Login/>;if(checking)return <div className="loading">جاري فتح النظام...</div>;if(!userId)return <Navigate to="/login" replace/>;if(profileError||!profile)return <div className="login-page"><section className="login-card"><div className="error">{profileError||'تعذر تحميل بيانات المستخدم.'}</div><button className="primary full" onClick={()=>window.location.reload()}>إعادة المحاولة</button></section></div>;return <ProtectedApp profile={profile}/>}
