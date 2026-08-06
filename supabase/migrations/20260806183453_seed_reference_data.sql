insert into departments (code, name, short, color, sort_order) values
  ('CSE',  'Computer Science & Engineering', 'Computer Science', '#2563EB', 1),
  ('ECE',  'Electronics & Communication',    'Electronics',      '#10B981', 2),
  ('EEE',  'Electrical & Electronics',       'Electrical',       '#F59E0B', 3),
  ('ME',   'Mechanical Engineering',         'Mechanical',       '#8B5CF6', 4),
  ('CE',   'Civil Engineering',              'Civil',            '#EC4899', 5),
  ('IT',   'Information Technology',         'Info. Tech',       '#06B6D4', 6),
  ('AIDS', 'AI & Data Science',              'AI & Data Sci.',   '#EF4444', 7);

insert into booths (id, name, photographer, avg_minutes, served_today) values
  (1, 'Booth 1 - North Wing',        'Arun Photography',  3, 412),
  (2, 'Booth 2 - Auditorium Foyer',  'Frames by Nithin',  4, 379);

insert into event_settings (id, name, college, tagline, event_date, venue, status) values
  (1, 'Laureate 2K26', 'College of Engineering Kidangoor',
   'Graduation Management System', '6 August 2026',
   'Main Auditorium & Quadrangle, CEK Campus', 'Session II - Live');

insert into timeline_items (time_label, title, detail, status, sort_order) values
  ('07:30', 'Venue Setup Complete',        'Stage, booths and registration desks live', 'done', 1),
  ('08:00', 'Registration Opened',         '6 desks - QR check-in active',              'done', 2),
  ('09:15', 'Inaugural Address',           'Principal Dr. K. Ramachandran',             'done', 3),
  ('10:00', 'Degree Conferral - Session I','CSE - ECE - IT - 1,047 graduates',          'done', 4),
  ('11:30', 'Degree Conferral - Session II','EEE - ME - in progress',                   'active', 5),
  ('13:00', 'Lunch Service',               'Dining hall - 4 counters',                  'upcoming', 6),
  ('14:30', 'Degree Conferral - Session III','CE - AIDS - 386 graduates',               'upcoming', 7),
  ('16:00', 'Group Photograph',            'Main quadrangle, all departments',          'upcoming', 8),
  ('17:00', 'Valedictory & Close',         'Certificate desk closes at 18:00',          'upcoming', 9);

insert into announcements (body, sort_order) values
  ('Session II degree conferral in progress - EEE and Mechanical graduates please assemble at Holding Area B.', 1),
  ('Photo Booth 2 is experiencing a short delay. Estimated wait is 22 minutes.', 2),
  ('Lunch service opens at 13:00 in the main dining hall. Please carry your QR badge.', 3),
  ('Family members are requested to remain seated during the conferral ceremony.', 4),
  ('Certificate collection desk is open at Hall B until 18:00.', 5),
  ('Lost and found is located beside Registration Desk 1.', 6);
