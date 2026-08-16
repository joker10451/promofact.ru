const token = 'vk1.a.xqJBZ-gjTZgVXy093SPWLnzdq2aIEMHO_llnJVCpNgL9fR665rfleQ124igjoeaY3bYtv4pP0vxs4M5oatqnTr0BG2UYvhdQhecO1dutUDXBCv63O8_VrOH443v1yNynuJrZBE9rgihwdHWsDa8FrG2bg3gUwgXxDQ1vlBHW0FZeosSFMg2chu-FC5ojkNzft5QYpRZnKYgCsZ2vYsZoEw';
const groupId = '240879299';
const imageUrl = 'https://www.google.com/s2/favicons?domain=tanuki.ru&sz=128';

async function testUploadPhoto() {
  try {
    // 1. Получаем сервер для загрузки фото на стену сообщества
    const serverUrl = `https://api.vk.com/method/photos.getWallUploadServer?v=5.199&access_token=${token}&group_id=${groupId}`;
    const serverRes = await fetch(serverUrl);
    const serverData = await serverRes.json();
    console.log('1. Server:', serverData);

    if (!serverData.response?.upload_url) {
      console.error('No upload_url:', serverData);
      return;
    }

    // 2. Скачиваем картинку
    const imgRes = await fetch('https://cdn.perfluence.net/media/project/logo/tanuki.png');
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Отправляем multipart/form-data на upload_url
    const blob = new Blob([buffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('photo', blob, 'coupon.png');

    const uploadRes = await fetch(serverData.response.upload_url, {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json();
    console.log('2. Upload data:', uploadData);

    // 4. Сохраняем фото
    const saveParams = new URLSearchParams({
      v: '5.199',
      access_token: token,
      group_id: groupId,
      photo: uploadData.photo,
      server: String(uploadData.server),
      hash: uploadData.hash,
    });

    const saveRes = await fetch('https://api.vk.com/method/photos.saveWallPhoto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: saveParams.toString(),
    });
    const saveData = await saveRes.json();
    console.log('3. Save photo data:', saveData);

    if (saveData.response?.[0]) {
      const p = saveData.response[0];
      const attachment = `photo${p.owner_id}_${p.id}`;
      console.log('Attachment ID:', attachment);

      // 5. Публикуем пост с фото
      const postParams = new URLSearchParams({
        v: '5.199',
        access_token: token,
        owner_id: `-${groupId}`,
        from_group: '1',
        message: '🍣 Вкусная скидка 20% в Тануки по промокоду 20AV1474!\n\n👉 https://promofact.ru/store/tanukifamily/20AV1474',
        attachments: attachment,
      });

      const postRes = await fetch('https://api.vk.com/method/wall.post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: postParams.toString(),
      });
      const postData = await postRes.json();
      console.log('4. Post with photo result:', postData);
    }
  } catch (err) {
    console.error('Error during photo upload:', err);
  }
}

testUploadPhoto();
