// TEMPORÁRIO (branch tmp-fotos, só preview): devolve uma foto do Unsplash em base64.
module.exports = async (req, res) => {
  const id = String((req.query || {}).id || '');
  const w = Math.min(2400, parseInt((req.query || {}).w || '400', 10) || 400);
  if (!/^[0-9]{10,13}-[0-9a-f]{6,14}$/.test(id)) return res.status(400).end('id');
  const r = await fetch('https://images.unsplash.com/photo-' + id + '?w=' + w + '&q=80&fm=jpg');
  const b = Buffer.from(await r.arrayBuffer());
  res.setHeader('Content-Type', 'text/plain');
  res.end(b.toString('base64'));
};
