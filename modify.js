const fs = require('fs');
let c = fs.readFileSync('src/app/category/[slug]/page.tsx', 'utf8');

c = c.replace(
  'import { getCategories, getCoupons, getUsesStats } from "@/lib/perfluence";',
  'import { getCoupons, getUsesStats } from "@/lib/perfluence";\nimport { getCollections } from "@/lib/collections";'
);
c = c.replace(
  'const categories = await getCategories();',
  'const categories = await getCollections();'
);
c = c.replace(
  'const [categories, all] = await Promise.all([getCategories(), getCoupons()]);',
  'const [collections, all] = await Promise.all([getCollections(), getCoupons()]);'
);
c = c.replace(
  'const [categories, all, uses] = await Promise.all([\n    getCategories(),',
  'const [collections, all, uses] = await Promise.all([\n    getCollections(),'
);
c = c.replace('import OtherCategories from "@/components/OtherCategories";\n', '');
c = c.replace('<OtherCategories current={cat.slug} />\n', '');

c = c.replaceAll('catName', 'colName');
c = c.replaceAll('cat.name', 'col.name');
c = c.replaceAll('cat.slug', 'col.slug');
c = c.replaceAll('const cat = categories', 'const col = collections');
c = c.replaceAll('if (!cat)', 'if (!col)');
c = c.replaceAll('cat.', 'col.');
c = c.replaceAll('/category/', '/collections/');
c = c.replaceAll('категории', 'подборке');
c = c.replaceAll('категорию', 'подборку');
c = c.replaceAll('категория', 'подборка');

c = c.replace(
  'const list = all.filter((c) => c.store.categorySlug === slug);',
  'const list = all.filter(col.filter);'
);

if (!fs.existsSync('src/app/collections/[slug]')) {
  fs.mkdirSync('src/app/collections/[slug]', { recursive: true });
}
fs.writeFileSync('src/app/collections/[slug]/page.tsx', c);
console.log('Modified');
