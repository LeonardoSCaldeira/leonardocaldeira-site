# Como esta pasta é publicada

O site fica em `public_html/inicio/` na hospedagem, e o WordPress continua
intocado em `public_html/`. Só o endereço raiz aponta para cá.

Quem faz esse desvio é este bloco no `.htaccess` **da raiz** (o do WordPress),
colado **antes** do bloco `# BEGIN WordPress`:

```apache
# Pagina inicial estatica
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^$ inicio/index.html [L]
  RewriteCond %{DOCUMENT_ROOT}/inicio%{REQUEST_URI} -f
  RewriteRule ^(.*)$ inicio/$1 [L]
</IfModule>
```

A segunda regra pergunta se o arquivo pedido existe dentro de `inicio/`. Se
existir, serve de lá; se não, o pedido segue para o WordPress.

**Não troque isso por uma lista de pastas.** A primeira versão desviava só
`^assets/`, e o `estilos.css` — que o HTML pede de forma relativa, virando
`/estilos.css` na raiz — caía no WordPress e dava 404. A página abria sem
estilo nenhum.

O que acontece em cada caso:

- `/` — entrega `inicio/index.html`, a página nova
- `/estilos.css`, `/assets/...` — existem em `inicio/`, entregues de lá
- `/perfume/`, `/igor-camargo/` e as demais 11 — caem no WordPress
- `/wp-admin/`, `/wp-login.php` — WordPress, como sempre

Se um dia quiser voltar a página inicial para o WordPress, apague esse bloco.
Nada mais precisa ser desfeito.

## Histórico que vale lembrar

Em 19/08/2026 o `public_html` foi esvaziado por engano numa primeira tentativa
de publicação, e o WordPress com 13 páginas foi apagado. O banco de dados
sobreviveu inteiro (o deploy do Git não toca em MySQL) e os arquivos voltaram
pelo backup automático semanal da Hostinger, em **Arquivos → Backups →
Restaurar e baixar → Backup de arquivos**.

Lição: **conferir o que existe no domínio antes de propor apagar qualquer
coisa.** O sitemap (`/wp-sitemap.xml`) mostra as páginas em segundos.
