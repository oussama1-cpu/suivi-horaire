# Suivi Horaire — App RH

Application web de suivi des heures de travail, congés et maladie, inspirée du fichier Excel `Administration - Suivi horaire`. Multi-employés, avec espace **Admin RH** et espace **Employé**.

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **Supabase** (Postgres + Auth) — base de données et authentification
- **Tailwind CSS** — interface

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → crée un projet gratuit.
2. Dans **SQL Editor**, colle et exécute le contenu de `supabase/schema.sql` (crée les tables et les règles de sécurité).
3. Dans **Project Settings → API**, récupère :
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ secrète, jamais côté client)

## 2. Configurer les variables d'environnement

Crée un fichier `.env.local` à la racine du projet avec :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 3. Créer le premier compte Admin RH

1. Dans Supabase → **Authentication → Users → Add user**, crée un utilisateur (email + mot de passe).
2. Copie son `UID`.
3. Dans **SQL Editor**, exécute :

```sql
insert into public.profiles (id, email, full_name, role, function_title)
values ('<UID>', 'admin@example.com', 'Admin RH', 'admin', 'Responsable RH');
```

Tu peux maintenant te connecter à l'app avec cet email/mot de passe → tu arrives sur `/admin`.

## 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Fonctionnalités

- **Admin RH** : créer/gérer des employés, définir les objectifs d'heures hebdomadaires, les heures standard par jour de semaine, les soldes congé/maladie, consulter et corriger le suivi horaire de chaque employé.
- **Employé** : saisir ses heures quotidiennes (Présentiel/Télétravail/Congé/Maladie/Férié/Repos), voir son résumé hebdomadaire (heures vs objectif 42h), voir ses soldes de congés/maladie.
- Calcul automatique des heures : Congé/Maladie/Férié payé → heures standard du jour ; sinon Fin − Début − Pause.

## Déploiement

Déployable sur Netlify ou Vercel. Pense à renseigner les 3 variables d'environnement ci-dessus dans les paramètres du site déployé.
