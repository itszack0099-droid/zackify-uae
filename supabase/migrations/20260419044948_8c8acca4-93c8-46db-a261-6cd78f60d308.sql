-- Enable realtime updates for orders, return_requests, products
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.return_requests REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_requests;