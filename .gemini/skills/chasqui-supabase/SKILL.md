---
name: chasqui-supabase
description: Manage Supabase database schemas, RLS policies, and authentication workflows for the Chasqui TV project. Use when performing migrations, fixing permission errors, or managing user roles.
---

# Chasqui Supabase

## Overview

This skill provides the necessary knowledge and workflows to manage the Supabase backend of Chasqui TV. It includes table schemas, RLS (Row Level Security) templates, and authentication procedures.

## Database Schema

### Table: noticias
- `id`: bigint (primary key, auto-increment)
- `titulo`: text
- `slug`: text (unique)
- `resumen`: text
- `contenido`: text (HTML)
- `imagen_url`: text
- `categoria_id`: bigint (foreign key to categorias)
- `autor_id`: uuid (foreign key to perfiles)
- `estado`: text ('borrador', 'publicado')
- `vistas`: int (default 0)
- `created_at`: timestamp

### Table: categorias
- `id`: bigint (primary key)
- `nombre`: text
- `slug`: text

### Table: banners
- `id`: bigint (primary key, auto-increment)
- `nombre`: text
- `posicion`: text ('header', 'sidebar', 'articulo', 'footer')
- `imagen_url`: text
- `url_destino`: text
- `activo`: boolean

### Table: perfiles
- `id`: uuid (references auth.users)
- `nombre`: text
- `rol`: text ('admin', 'editor', 'redactor')

## RLS Policy Templates

### Public Read Access
Use this when a table needs to be visible to everyone (visitors):
```sql
CREATE POLICY "Public Read" ON public.<table_name> FOR SELECT USING (true);
```

### Authenticated Full Access
Use this for tables managed by the admin panel:
```sql
CREATE POLICY "Admin Full Access" ON public.<table_name> 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Storage Access (Bucket: noticias)
Ensure the bucket is public and policies allow selection:
```sql
CREATE POLICY "Public Images" ON storage.objects FOR SELECT USING (bucket_id = 'noticias');
```

## Workflows

### 1. Fixing "New row violates RLS policy"
1. Verify the user is authenticated in the session.
2. Check if the table has an active policy for the operation (INSERT/UPDATE).
3. If missing, apply the "Admin Full Access" template.

### 2. Creating New Users
1. Add user in Supabase Auth -> Users.
2. Manually confirm email or disable email confirmation in Auth -> Providers.
3. Insert matching record in `public.perfiles` with the desired `rol`.
