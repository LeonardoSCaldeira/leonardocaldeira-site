# Como esta pasta é publicada

O site fica em `public_html/inicio/` na hospedagem, e o WordPress continua
intocado em `public_html/`. Só o endereço raiz aponta para cá.

Quem faz esse desvio são quatro linhas no `.htaccess` **da raiz** (o do
WordPress), coladas **antes** do bloco `# BEGIN WordPress`:

```apache
# Pagina inicial estatica
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^$ inicio/index.html [L]
  RewriteRule ^assets/(.*)$ inicio/assets/$1 [L]
</IfModule>
```

O que cada caso faz depois disso:

- `/` — entrega `inicio/index.html`, a página nova
- `/assets/...` — entrega de `inicio/assets/...`
- `/perfume/`, `/igor-camargo/` e as demais — caem no WordPress, como sempre
- `/wp-admin/` — WordPress, como sempre

Se um dia quiser voltar a página inicial para o WordPress, apague essas quatro
linhas. Nada mais precisa ser desfeito.
