DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- Change owner of all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO digifort_admin;'; 
    END LOOP; 
    
    -- Change owner of all sequences
    FOR r IN (SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'S' AND n.nspname = 'public') LOOP 
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.relname) || ' OWNER TO digifort_admin;'; 
    END LOOP; 
    
    -- Change owner of all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP 
        EXECUTE 'ALTER VIEW public.' || quote_ident(r.viewname) || ' OWNER TO digifort_admin;'; 
    END LOOP;
END $$;
