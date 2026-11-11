import {test,expect} from '@playwright/test';
import sharp from 'sharp';
test('avatar: subir desde perfil, conservar al recargar y quitar',async({page})=>{
 await page.goto('/login');await page.getByLabel('Correo electrónico').fill('ana@demo.local');await page.getByLabel('Contraseña',{exact:true}).fill('CiudadDemo2026!');await page.getByRole('button',{name:'Entrar a Ciudad Escucha'}).click();await expect(page).not.toHaveURL(/login/);await page.goto('/perfil');
 const buffer=await sharp({create:{width:80,height:60,channels:3,background:'#da9d65'}}).png().toBuffer();
 await page.getByLabel('Subir avatar').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer});await expect(page.getByRole('status').filter({hasText:'Avatar actualizado'})).toBeVisible();await expect(page.locator('.profile-hero img')).toBeVisible();const src=await page.locator('.profile-hero img').getAttribute('src');await page.reload();await expect(page.locator('.profile-hero img')).toHaveAttribute('src',src);await expect(page.getByRole('heading',{name:'Mis amigos'})).toBeVisible();await page.getByRole('button',{name:'Quitar avatar'}).click();await expect(page.locator('.profile-hero img')).toHaveCount(0);
});
