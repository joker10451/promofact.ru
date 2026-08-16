const token = 'vk1.a.xqJBZ-gjTZgVXy093SPWLnzdq2aIEMHO_llnJVCpNgL9fR665rfleQ124igjoeaY3bYtv4pP0vxs4M5oatqnTr0BG2UYvhdQhecO1dutUDXBCv63O8_VrOH443v1yNynuJrZBE9rgihwdHWsDa8FrG2bg3gUwgXxDQ1vlBHW0FZeosSFMg2chu-FC5ojkNzft5QYpRZnKYgCsZ2vYsZoEw';
const ownerId = '-240879299';

const postText = `🔥 Свежий промокод: РИВ ГОШ!

💄 Скидка 1 000 ₽ на парфюмерию и косметику от 3 000 ₽!

📌 Условия: Действует на первый и повторные заказы в интернет-магазине и приложении РИВ ГОШ.

🎟 Промокод: PFQ8W3XMT

👉 Скопировать и применить:
https://promofact.ru/store/riv-gosh/PFQ8W3XMT

#скидки #косметика #промокод #ривгош #промофакт`;

const params = new URLSearchParams({
  v: '5.199',
  access_token: token,
  owner_id: ownerId,
  from_group: '1',
  message: postText
});

fetch('https://api.vk.com/method/wall.post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params.toString()
})
.then(r => r.json())
.then(data => {
  console.log('VK POST RESULT:', JSON.stringify(data, null, 2));
  process.exit(0);
})
.catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
