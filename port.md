c3bfb8ed74f3   go-simrs-frontend                 "/docker-entrypoint.…"   12 days ago     Up 12 days                  0.0.0.0:3232->80/tcp, [::]:3232->80/tcp                  simrs-frontend
517a751c126c   go-simrs-backend                  "./main"                 12 days ago     Up 12 days                  0.0.0.0:8899->8080/tcp, [::]:8899->8080/tcp              simrs-backend
019c02fdeb83   postgres:15-alpine                "docker-entrypoint.s…"   12 days ago     Up 12 days (healthy)        0.0.0.0:5555->5432/tcp, [::]:5555->5432/tcp              simrs-postgres
f046d2bf4c94   go-pos-frontend                   "/docker-entrypoint.…"   6 weeks ago     Up 6 weeks                  0.0.0.0:3211->80/tcp, [::]:3211->80/tcp                  pos-frontend
1b10ab91f7a2   go-pos-backend                    "./main"                 6 weeks ago     Up 6 weeks                  0.0.0.0:8055->8080/tcp, [::]:8055->8080/tcp              pos-backend
515bafbb8651   postgres:15-alpine                "docker-entrypoint.s…"   6 weeks ago     Up 6 weeks (healthy)        0.0.0.0:5666->5432/tcp, [::]:5666->5432/tcp              515bafbb8651_pos-postgres
ca34e7b6783b   nginx:alpine                      "/docker-entrypoint.…"   2 months ago    Up 2 weeks                  80/tcp, 0.0.0.0:8070->8070/tcp, [::]:8070->8070/tcp      nginx_administrasi
5a07becf6b26   administrasi-administrasi         "docker-php-entrypoi…"   2 months ago    Up 2 weeks                  9000/tcp                                                 administrasi
6323a192ad36   postgres:latest                   "docker-entrypoint.s…"   2 months ago    Up 2 months                 0.0.0.0:5445->5432/tcp, [::]:5445->5432/tcp              administrasi-administrasi_db-1
7d89e26e6d51   cloudflare/cloudflared:latest     "cloudflared --no-au…"   3 months ago    Exited (255) 2 months ago                                                            cloudflare-dimas
9a2d290aabdf   nginx:alpine                      "/docker-entrypoint.…"   3 months ago    Up 2 months                 80/tcp, 0.0.0.0:8044->8044/tcp, [::]:8044->8044/tcp      nginx_event
3f11a567b37f   postgres:latest                   "docker-entrypoint.s…"   3 months ago    Up 2 months                 0.0.0.0:5444->5432/tcp, [::]:5444->5432/tcp              event-event_db-1
0610899811be   event-event                       "docker-php-entrypoi…"   3 months ago    Up 2 months                 9000/tcp                                                 event
1c75af0d2d85   nginx:alpine                      "/docker-entrypoint.…"   3 months ago    Exited (255) 2 months ago   80/tcp, 0.0.0.0:8040->8040/tcp, [::]:8040->8040/tcp      nginx_pos
c1e8f01af6e8   postgres:latest                   "docker-entrypoint.s…"   3 months ago    Up 2 months                 0.0.0.0:5435->5432/tcp, [::]:5435->5432/tcp              pos-pos_db-1
dd2968b5230b   pos-pos                           "docker-php-entrypoi…"   3 months ago    Exited (255) 2 months ago   9000/tcp                                                 pos
68f4b71e6f45   cloudflare/cloudflared:latest     "cloudflared --no-au…"   5 months ago    Exited (255) 5 months ago                                                            CLoudflare
e2840ced145b   cloudflare/cloudflared:latest     "cloudflared --no-au…"   5 months ago    Exited (0) 5 months ago                                                              jovial_gould
5db9f96c9291   cloudflare/cloudflared:latest     "cloudflared --no-au…"   5 months ago    Exited (0) 5 months ago                                                              nostalgic_elbakyan
d358d172711c   nginx:alpine                      "/docker-entrypoint.…"   5 months ago    Exited (255) 5 months ago   80/tcp, 0.0.0.0:8040->8040/tcp, [::]:8040->8040/tcp      nginx_antrian
0c7243cc88ba   antrian-antrian                   "docker-php-entrypoi…"   5 months ago    Exited (255) 5 months ago   9000/tcp                                                 antrian
b30644812f0b   postgres:latest                   "docker-entrypoint.s…"   5 months ago    Up 2 months                 0.0.0.0:5433->5432/tcp, [::]:5433->5432/tcp              antrian-antrian_db-1
a438c43aa46d   nginx:alpine                      "/docker-entrypoint.…"   6 months ago    Up 2 months                 80/tcp, 0.0.0.0:8038->8038/tcp, [::]:8038->8038/tcp      nginx_akuntansi
297913c9c542   mysql                             "docker-entrypoint.s…"   6 months ago    Up 2 months                 33060/tcp, 0.0.0.0:3308->3306/tcp, [::]:3308->3306/tcp   akuntansi-akuntansi_db-1
536369ddf73f   akuntansi-akuntansi               "docker-php-entrypoi…"   6 months ago    Up 2 months                 9000/tcp                                                 akuntansi
4c41891c2e9a   cloudflare/cloudflared:latest     "cloudflared --no-au…"   6 months ago    Exited (2) 6 months ago                                                              vigilant_taussig
29a33a8600e4   cloudflare/cloudflared:latest     "cloudflared --no-au…"   6 months ago    Exited (0) 6 months ago                                                              happy_kapitsa
b99b467a8942   cloudflare/cloudflared:latest     "cloudflared --no-au…"   6 months ago    Exited (2) 6 months ago                                                              awesome_northcutt
4c6b455ace55   rme_react-primary_simrs           "docker-php-entrypoi…"   6 months ago    Exited (255) 2 months ago   9000/tcp                                                 primary_simrs
6450394ca646   mysql                             "docker-entrypoint.s…"   6 months ago    Up 2 months                 33060/tcp, 0.0.0.0:3307->3306/tcp, [::]:3307->3306/tcp   rme_react-primary_simrs_db-1
ca5db411145d   nginx:alpine                      "/docker-entrypoint.…"   6 months ago    Exited (255) 2 months ago   80/tcp, 0.0.0.0:8036->8036/tcp, [::]:8036->8036/tcp      nginx_primary
ebe3fd809692   nginx:alpine                      "/docker-entrypoint.…"   9 months ago    Exited (255) 5 months ago   0.0.0.0:80->80/tcp, [::]:80->80/tcp                      nginx_simrs
ae255306a1f2   simrs-simrs                       "docker-php-entrypoi…"   9 months ago    Exited (255) 5 months ago   9000/tcp                                                 simrs
831e488df307   mysql                             "docker-entrypoint.s…"   9 months ago    Up 2 months                 33060/tcp, 0.0.0.0:3301->3306/tcp, [::]:3301->3306/tcp   simrs-db_simrs-1
2019b002741c   dashboard_rilt-dashboard_klinik   "docker-php-entrypoi…"   9 months ago    Exited (255) 5 months ago   0.0.0.0:9000->9000/tcp, [::]:9000->9000/tcp              dashboard_klinik
6fcced25874a   postgres                          "docker-entrypoint.s…"   9 months ago    Exited (255) 5 months ago   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp              postgres
1e0ec87fa18e   nginx:alpine                      "/docker-entrypoint.…"   9 months ago    Exited (255) 5 months ago   80/tcp, 0.0.0.0:8021->8021/tcp, [::]:8021->8021/tcp      nginx_dashboard
24542ecde2a0   wa_gateway:0.0.1                  "docker-entrypoint.s…"   10 months ago   Exited (255) 5 months ago   3000/tcp, 0.0.0.0:5000->5000/tcp, [::]:5000->5000/tcp    wa_gateway
aa0210a4ce16   mysql                             "docker-entrypoint.s…"   10 months ago   Exited (255) 5 months ago   0.0.0.0:3306->3306/tcp, [::]:3306->3306/tcp, 33060/tcp   mysql