INSERT INTO "products" ("slug","name","description","fabric","category","colors","sizes","price","compare_at_price","images","featured","active","made_to_order","rating","review_count") VALUES
('noor-velvet-ensemble','Noor Velvet Ensemble','A regal midnight-blue velvet two-piece with hand-set gold tilla along the neckline and cuffs.','Micro Velvet 9000','Formal',ARRAY['Blue','Gold'],ARRAY['XS','S','M','L','XL','XXL','Custom'],14500,16800,ARRAY['/images/products/p01.jpg','/images/products/p06.jpg'],true,true,true,50,0),
('mehr-ivory-luxe','Mehr Ivory Luxe','Soft ivory three-piece with delicate threadwork and a flowing chiffon dupatta.','Chiffon & Raw Silk','Formal',ARRAY['White','Gold'],ARRAY['XS','S','M','L','XL','XXL','Custom'],12800,NULL,ARRAY['/images/products/p02.jpg','/images/products/p05.jpg'],true,true,true,50,0),
('shabnam-black-embroidered','Shabnam Black Embroidered','Jet-black kameez with tonal resham embroidery and mirror accents.','Georgette','Party',ARRAY['Black','Silver'],ARRAY['XS','S','M','L','XL','XXL','Custom'],11200,12900,ARRAY['/images/products/p03.jpg','/images/products/p09.jpg'],true,true,true,50,0),
('gul-bahaar-lawn-suit','Gul Bahaar Lawn Suit','Feather-light printed lawn two-piece for everyday grace.','Premium Lawn','Casual',ARRAY['White','Pink'],ARRAY['XS','S','M','L','XL','XXL','Custom'],6400,NULL,ARRAY['/images/products/p04.jpg'],false,true,true,50,0),
('chandni-white-classic','Chandni White Classic','The crisp white classic every wardrobe needs with chikankari-inspired panel.','Cambric Cotton','Casual',ARRAY['White'],ARRAY['XS','S','M','L','XL','XXL','Custom'],5800,6800,ARRAY['/images/products/p05.jpg','/images/products/p04.jpg'],false,true,true,50,0),
('zardozi-velvet-royal','Zardozi Velvet Royal','Plush velvet with antique zardozi hand-embroidery from our Narowal atelier.','Silk Velvet','Formal',ARRAY['Maroon','Gold'],ARRAY['XS','S','M','L','XL','XXL','Custom'],16900,NULL,ARRAY['/images/products/p06.jpg','/images/products/p01.jpg'],true,true,true,50,0),
('sunehri-evening-gown','Sunehri Evening Gown','A soft-gold draped gown with east-meets-west tailoring and concealed pockets.','Satin Silk','Party',ARRAY['Gold','Brown'],ARRAY['XS','S','M','L','XL','XXL','Custom'],13400,NULL,ARRAY['/images/products/p07.jpg'],false,true,true,50,0),
('laal-anarkali','Laal Anarkali','A show-stopping crimson Anarkali with gold gota edging.','Chiffon & Net','Party',ARRAY['Red','Gold'],ARRAY['XS','S','M','L','XL','XXL','Custom'],15600,18000,ARRAY['/images/products/p08.jpg','/images/products/b14.jpg'],true,true,true,50,0),
('raat-ki-rani','Raat Ki Rani','Midnight-black formal with silver zari vines climbing the hem.','Raw Silk','Formal',ARRAY['Black','Silver'],ARRAY['XS','S','M','L','XL','XXL','Custom'],10900,NULL,ARRAY['/images/products/p09.jpg','/images/products/p03.jpg'],false,true,true,50,0),
('phool-jhaadi','Phool Jhaadi','A garden-print casual suit in warm terracotta tones with lace finishing.','Khaddar Blend','Casual',ARRAY['Brown','Pink'],ARRAY['XS','S','M','L','XL','XXL','Custom'],7200,NULL,ARRAY['/images/products/p10.jpg','/images/products/p04.jpg'],false,true,true,50,0),
('sheesh-mahal-bridal','Sheesh Mahal Bridal Lehenga','The signature DRESSES bridal with hand embroidery, kora-dabka and mirrorwork.','Bridal Raw Silk','Bridal',ARRAY['Red','Gold'],ARRAY['XS','S','M','L','XL','XXL','Custom'],68000,78000,ARRAY['/images/products/p11.jpg','/images/products/b13.jpg','/images/products/p12.jpg'],true,true,true,50,0),
('heer-ranjha-bridal','Heer Ranjha Bridal','Romantic red-and-gold bridal with heritage zardozi borders.','Velvet & Net','Bridal',ARRAY['Red','Maroon','Gold'],ARRAY['XS','S','M','L','XL','XXL','Custom'],54500,NULL,ARRAY['/images/products/p12.jpg','/images/products/b14.jpg','/images/products/b13.jpg'],false,true,true,50,0)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "reviews" ("product_id","author_name","location","rating","text","approved")
SELECT p."id",v.author_name,v.location,v.rating,v.text,true FROM (VALUES
('Ayesha Khan','Lahore',5,'My Sheesh Mahal bridal arrived three days early and fit like it was poured onto me.','sheesh-mahal-bridal'),
('Fatima Raza','Sialkot',5,'Sent my measurements through WhatsApp, chose the Laal Anarkali, and wore it to my cousin\'s mehndi.','laal-anarkali'),
('Mahnoor Asif','Narowal',5,'Being local I picked mine up — the finishing inside is as neat as the outside.','zardozi-velvet-royal'),
('Zainab Tariq','Karachi',4,'Ordered two casual suits. Stitching is excellent and tracking updates kept me informed.','gul-bahaar-lawn-suit'),
('Iqra Nadeem','Islamabad',5,'The AI assistant helped me pick between M and custom — the fit is unreal.','mehr-ivory-luxe'),
('Hira Shahid','Gujranwala',5,'The Chandni white is my Friday uniform now — fabric still crisp after a dozen washes.','chandni-white-classic'),
('Amna Yousaf','Faisalabad',5,'Bridal maxi with my own reference photo — they matched the embroidery beautifully.','heer-ranjha-bridal'),
('Khadija Mir','Rawalpindi',4,'Shabnam black for a dinner — got compliments all evening.','shabnam-black-embroidered'),
('Rabia Anwar','Multan',5,'COD for the balance is such a relief when ordering from a new brand.','noor-velvet-ensemble'),
('Sana Javed','Narowal',5,'The size guide was spot on and the kameez length option meant no alterations.','phool-jhaadi')
) AS v(author_name,location,rating,text,slug)
JOIN "products" p ON p."slug" = v.slug
WHERE NOT EXISTS (SELECT 1 FROM "reviews" r WHERE r."author_name"=v.author_name AND r."text"=v.text);
