import { randomUUID } from "node:crypto";
import { one, run, transaction } from "./db.js";
import { hashPassword } from "./auth.js";
import { categories, districts } from "./domain.js";
if (process.env.DEMO_MODE !== "true")
  throw new Error(
    "El seed requiere DEMO_MODE=true. Nunca ejecutarlo en producción.",
  );
transaction(() => {
  for (const [name, email, role] of [
    ["Lucía", "lucia@demo.local", "ciudadano"],
    ["Elena", "elena@demo.local", "ciudadano"],
    ["Julio", "julio@demo.local", "ciudadano"],
    ["Karina", "karina@demo.local", "operador"],
    ["Arturo", "admin@demo.local", "administrador"],
    ["Ana", "ana@demo.local", "ciudadano"],
    ["Mateo", "mateo@demo.local", "ciudadano"],
    ["Sofía", "sofia@demo.local", "ciudadano"],
    ["Diego", "diego@demo.local", "ciudadano"],
    ["Valeria", "valeria@demo.local", "ciudadano"],
    ["Renato", "renato@demo.local", "ciudadano"],
    ["Camila", "camila@demo.local", "ciudadano"],
    ["Luis", "luis@demo.local", "operador"],
  ])
    if (!one("SELECT id FROM users WHERE email=?", email))
      run(
        "INSERT INTO users(id,name,email,password,role,created) VALUES(?,?,?,?,?,?)",
        randomUUID(),
        name,
        email,
        hashPassword("CiudadDemo2026!"),
        role,
        new Date().toISOString(),
      );
  const elena = one("SELECT id,prefs FROM users WHERE email='elena@demo.local'");
  if (elena && !JSON.parse(elena.prefs).onboardingCompleted) run("UPDATE users SET prefs=? WHERE id=?", JSON.stringify({voiceMode:true,contrast:true,fontSize:140,onboardingCompleted:true}), elena.id);
  if (one("SELECT COUNT(*) n FROM reports").n === 0) {
    const user = one("SELECT id FROM users WHERE email='lucia@demo.local'");
    const places = Object.keys(districts).slice(0, 5);
    const titles = [
      "Pista dañada cerca del cruce peatonal",
      "Semáforo sin funcionamiento",
      "Luminaria apagada junto al parque",
      "Residuos acumulados en la esquina",
      "Fuga de agua en la vereda",
      "Alcantarilla sin tapa",
      "Rampa de acceso deteriorada",
      "Señal de tránsito caída",
      "Árbol obstruye la vereda",
      "Mobiliario del parque dañado",
      "Acceso peatonal bloqueado",
      "Incidencia por revisar",
    ];
    for (let i = 0; i < 30; i++) {
      const district = places[i % 5],
        point = districts[district],
        id = randomUUID(),
        date = new Date(Date.now() - i * 7200000).toISOString(),
        status = ["Reportado", "En revisión", "En atención", "Resuelto"][i % 4];
      run(
        "INSERT INTO reports(id,user_id,title,description,category,district,address,lat,lng,urgency,status,created,demo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1)",
        id,
        user.id,
        titles[i % 12],
        "Ejemplo para evaluación: vecinos describen una incidencia en el espacio público. Este registro no representa una denuncia real.",
        categories[i % 12],
        district,
        "Referencia de ejemplo, cerca del parque del barrio",
        point[0] + Math.sin(i) * 0.009,
        point[1] + Math.cos(i) * 0.009,
        ["Media", "Alta", "Baja"][i % 3],
        status,
        date,
      );
      run(
        "INSERT INTO history(report_id,user_id,status,note,created) VALUES(?,?,?,?,?)",
        id,
        user.id,
        status,
        "Estado de ejemplo para evaluación",
        date,
      );
    }
  }
  // One-time additional demo fixtures. Re-running seed preserves user edits and relationships.
  if (!one("SELECT version FROM migrations WHERE version=100")) {
    const emails=["ana","mateo","sofia","diego","valeria","renato","camila","elena"];
    const places=["Los Olivos","Miraflores","Barranco","Comas","San Miguel","Surco","San Martín de Porres","Los Olivos"];
    emails.forEach((email,i)=>{
      const u=one("SELECT id,prefs FROM users WHERE email=?",email+"@demo.local");
      run("UPDATE users SET bio=?,prefs=? WHERE id=?", "Cuenta ficticia para probar colaboración y seguimiento.",JSON.stringify({...JSON.parse(u.prefs),district:places[i],publicProfile:email!=="renato"}),u.id);
      for(let n=0;n<2;n++){
        const id=randomUUID(),status=n===1?"Resuelto":"Reportado",date=new Date().toISOString();
        run("INSERT INTO reports(id,user_id,title,description,category,district,address,lat,lng,urgency,status,created,demo,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?)",id,u.id,n?"Luminaria reparada · ejemplo":"Vereda deteriorada · ejemplo","Registro ficticio para pruebas de perfiles, amistades y estados. No corresponde a una denuncia real.",categories[n?2:0],places[i],"Parque de ejemplo, referencia ficticia",...districts[places[i]],n?"Baja":"Media",status,date,"demo-extra-"+email+"-"+n);
        run("INSERT INTO history(report_id,user_id,status,note,created) VALUES(?,?,?,?,?)",id,u.id,status,"Estado ficticio para evaluación",date);
      }
    });
    const id=name=>one("SELECT id FROM users WHERE email=?",name+"@demo.local").id;
    for (const [from,to,status] of [["ana","mateo","accepted"],["ana","sofia","accepted"],["ana","diego","pending"],["elena","valeria","accepted"],["lucia","camila","accepted"]]) run("INSERT OR IGNORE INTO neighbors VALUES(?,?,?,?)",id(from),id(to),"friend",status);
    run("INSERT OR IGNORE INTO neighbors VALUES(?,?,?,?)",id("mateo"),id("valeria"),"follow","accepted");
    run("INSERT INTO migrations VALUES(100)");
  }

});
console.log(
  "Seed listo: 13 cuentas demo, incluyendo Elena (voz), dos operadores, perfiles y amistades de prueba. Contraseña de desarrollo: CiudadDemo2026!",
);
