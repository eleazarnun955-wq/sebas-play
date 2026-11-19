' Configure these two values with the project's public Supabase URL and publishable key.
' The publishable/anon key is intended for client apps; NEVER use service_role or secret keys.
' GitHub Actions can inject these values from repository secrets before packaging.
' Do not commit private credentials here.
function SebasPlaySupabaseUrl() as string
    return "https://ououwdzxywmjpppzqxqy.supabase.co"
end function

function SebasPlayPublishableKey() as string
    return "REPLACE_WITH_SUPABASE_PUBLISHABLE_KEY"
end function
