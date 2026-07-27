import os
from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """
    Instantiates and returns Supabase Python Client.
    """
    url: str = settings.SUPABASE_URL or os.getenv("SUPABASE_URL", "https://duaqdsfhneklxlmxoibg.supabase.co")
    key: str = settings.SUPABASE_SERVICE_ROLE_KEY or os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
    return create_client(url, key)

supabase: Client = get_supabase_client()
