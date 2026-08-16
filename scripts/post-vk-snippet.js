const token = 'vk1.a.xqJBZ-gjTZgVXy093SPWLnzdq2aIEMHO_llnJVCpNgL9fR665rfleQ124igjoeaY3bYtv4pP0vxs4M5oatqnTr0BG2UYvhdQhecO1dutUDXBCv63O8_VrOH443v1yNynuJrZBE9rgihwdHWsDa8FrG2bg3gUwgXxDQ1vlBHW0FZeosSFMg2chu-FC5ojkNzft5QYpRZnKYgCsZ2vYsZoEw';
const ownerId = '-240879299';
const postUrl = 'https://promofact.ru/store/tanukifamily/20AV1474';

const postText = `🔥 Свежий промокод: Тануки (доставка еды)!

🍣 Скидка 20% на заказ от 1 490 ₽!

📌 Условия: Действует на доставку и самовывоз в приложении и на сайте TanukiFamily.

🎟 Промокод: 20AV1474

👉 Скопировать и применить: ${postUrl}

#скидки #доставка_еды #промокод #тануки #промофакт`;

const params = new URLSearchParams({
  v: '5.199',
  access_token: token,
  owner_id: ownerId,
  from_group: '1',
  message: postText,
  attachments: postUrl,
});

fetch('https://api.vk.com/method/wall.post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params.toString()
})
.then(r => r.json())
.then(data => {
  console.log('VK POST RESULT WITH BANNER SNIPPET:', JSON.stringify(data, null, 2));
  process.exit(0);
})
.catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
