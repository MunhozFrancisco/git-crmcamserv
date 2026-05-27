const net = require('net');

const host = 'supabase-supabase.wg7hod.easypanel.host';
const ports = [5432, 6543, 80, 443];

ports.forEach(port => {
  const socket = new net.Socket();
  socket.setTimeout(3000);
  
  socket.on('connect', () => {
    console.log(`Porta ${port} está ABERTA em ${host}`);
    socket.destroy();
  });
  
  socket.on('timeout', () => {
    console.log(`Porta ${port} deu TIMEOUT em ${host}`);
    socket.destroy();
  });
  
  socket.on('error', (err) => {
    console.log(`Porta ${port} está FECHADA em ${host} (${err.message})`);
  });
  
  socket.connect(port, host);
});
