function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getImageExtension(dataUrl) {
  const match = dataUrl.match(/^data:image\/(\w+);/);
  if (!match) return 'jpg';
  const type = match[1].toLowerCase();
  if (type === 'jpeg') return 'jpg';
  return type;
}

function prepareMenuForDeploy(menu) {
  return menu.map((item) => {
    const deployItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      active: item.active,
      image: item.image,
    };

    if (item.image && item.image.startsWith('data:')) {
      deployItem.image = `images/menu/${item.id}.${getImageExtension(item.image)}`;
    }

    return deployItem;
  });
}

async function exportDeployZip() {
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip is not loaded.');
  }

  const menu = getMenu();
  const settings = getSettings();
  const deployMenu = prepareMenuForDeploy(menu);
  const version = Math.max(
    parseInt(localStorage.getItem(STORAGE_KEYS.menuVersion) || '0', 10),
    MENU_VERSION
  ) + 1;

  const zip = new JSZip();
  const deployPayload = {
    version,
    updatedAt: new Date().toISOString(),
    menu: deployMenu,
  };

  zip.file('data/menu.json', JSON.stringify(deployPayload, null, 2));
  zip.file(
    'data/settings.json',
    JSON.stringify(
      {
        version,
        updatedAt: deployPayload.updatedAt,
        restaurantName: settings.restaurantName,
        upiId: settings.upiId,
        upiPayeeName: settings.upiPayeeName,
      },
      null,
      2
    )
  );

  zip.file(
    'DEPLOY-README.txt',
    [
      'Publish to Vercel / Netlify',
      '==========================',
      '',
      '1. Extract this ZIP into your project folder (replace files).',
      '2. Commit and push to GitHub.',
      '3. Vercel will auto-redeploy — menu & images update for all visitors.',
      '',
      'Files included:',
      '- data/menu.json',
      '- data/settings.json',
      '- images/menu/*.jpg (custom uploaded photos)',
      '',
      `Version: ${version}`,
      `Exported: ${deployPayload.updatedAt}`,
    ].join('\n')
  );

  menu.forEach((item) => {
    if (item.image && item.image.startsWith('data:')) {
      const ext = getImageExtension(item.image);
      const path = `images/menu/${item.id}.${ext}`;
      zip.file(path, dataUrlToUint8Array(item.image));
    }
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vercel-deploy-v${version}-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);

  localStorage.setItem(STORAGE_KEYS.menuVersion, String(version));
  localStorage.setItem(STORAGE_KEYS.settingsVersion, String(version));

  return version;
}

async function loadRemoteSiteData() {
  try {
    const [menuRes, settingsRes] = await Promise.all([
      fetch('data/menu.json', { cache: 'no-store' }),
      fetch('data/settings.json', { cache: 'no-store' }),
    ]);

    if (!menuRes.ok) return false;

    const menuPayload = await menuRes.json();
    const localMenuVersion = parseInt(localStorage.getItem(STORAGE_KEYS.menuVersion) || '0', 10);
    const remoteMenuVersion = parseInt(menuPayload.version || '0', 10);

    if (remoteMenuVersion > localMenuVersion && Array.isArray(menuPayload.menu)) {
      localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(menuPayload.menu));
      localStorage.setItem(STORAGE_KEYS.menuVersion, String(remoteMenuVersion));
    }

    if (settingsRes.ok) {
      const settingsPayload = await settingsRes.json();
      const localSettingsVersion = parseInt(
        localStorage.getItem(STORAGE_KEYS.settingsVersion) || '0',
        10
      );
      const remoteSettingsVersion = parseInt(settingsPayload.version || '0', 10);

      if (remoteSettingsVersion > localSettingsVersion) {
        const current = getSettings();
        saveSettings({
          ...current,
          restaurantName: settingsPayload.restaurantName || current.restaurantName,
          upiId: settingsPayload.upiId || current.upiId,
          upiPayeeName: settingsPayload.upiPayeeName || current.upiPayeeName,
        });
        localStorage.setItem(STORAGE_KEYS.settingsVersion, String(remoteSettingsVersion));
      }
    }

    return true;
  } catch {
    return false;
  }
}
