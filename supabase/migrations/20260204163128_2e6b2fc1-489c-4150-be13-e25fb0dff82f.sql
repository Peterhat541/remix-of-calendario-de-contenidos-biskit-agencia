-- Tabla para registrar actividad de usuarios
CREATE TABLE public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_activity_user ON public.user_activity_logs(user_id);
CREATE INDEX idx_activity_created ON public.user_activity_logs(created_at DESC);
CREATE INDEX idx_activity_action ON public.user_activity_logs(action);

-- Habilitar RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver los logs
CREATE POLICY "Admins can view all logs" ON public.user_activity_logs
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Usuarios autenticados pueden insertar logs (para registrar su propia actividad)
CREATE POLICY "Authenticated users can insert logs" ON public.user_activity_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);