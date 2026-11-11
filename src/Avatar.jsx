import React, {useState,useEffect} from 'react';
export function Avatar({user,large=false}){const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[user?.avatar]);return <span className={'avatar'+(large?' large':'')}>{user?.avatar&&!failed?<img src={user.avatar} alt={'Avatar de '+user.name} onError={()=>setFailed(true)}/>:user?.name?.[0]||'?'}</span>}
