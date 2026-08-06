-- Generates the full 2,047-graduate cohort. setseed makes this
-- reproducible: re-running yields identical data.
do $$
declare
  first_names text[] := array[
    'Aadhil','Aarcha','Abhinav','Adithyan','Aiswarya','Akhil','Alan','Aleena','Amal','Ananya',
    'Anjana','Anoop','Arjun','Ashna','Athira','Bhagya','Christo','Devika','Dhanya','Fathima',
    'Gautham','Gopika','Hari','Irfan','Jaseem','Jishnu','Joel','Kavya','Krishna','Lakshmi',
    'Manu','Meenakshi','Muhammed','Nandana','Navaneeth','Nikhil','Nithya','Parvathy','Praveen','Rahul',
    'Ravi','Reshma','Rohith','Sandra','Sanjay','Sarath','Shafeeq','Sneha','Sreelakshmi','Sujith',
    'Thejus','Vaishnav','Varsha','Vishnu','Yadhu','Zaid','Nafeesa','Elizabeth','Tomy','Ashwin'];
  last_names text[] := array[
    'Nair','Menon','Pillai','Kurup','Varma','Thomas','Joseph','Mathew','George','Jacob',
    'Rahman','Basheer','Salim','Hussain','Krishnan','Raj','Kumar','Das','Panicker','Warrier',
    'Chandran','Mohan','Prasad','Suresh','Vijayan','Anil','Babu','Sebastian','Philip','Antony'];

  dept_codes  text[] := array['CSE','ECE','EEE','ME','CE','IT','AIDS'];
  dept_counts int[]  := array[468, 392, 318, 296, 241, 187, 145];

  d          int;
  code       text;
  dept_total int;
  i          int;
  r          numeric;
  full_name  text;
  v_stage    public.ceremony_stage;
  v_checked  boolean;
  v_stage_d  boolean;
  v_booth    boolean;
  v_lunch    boolean;
  v_cert     boolean;
  serial_no  int := 0;
begin
  perform setseed(0.42);

  for d in 1..array_length(dept_codes, 1) loop
    code       := dept_codes[d];
    dept_total := dept_counts[d];

    for i in 1..dept_total loop
      serial_no := serial_no + 1;
      r := random();

      full_name := first_names[1 + floor(random() * array_length(first_names,1))::int]
                   || ' ' ||
                   last_names[1 + floor(random() * array_length(last_names,1))::int];

      -- Funnel: each stage is a strict subset of the one before it.
      v_checked := r < 0.742;
      v_stage_d := r < 0.514;
      v_booth   := r < 0.387;
      v_lunch   := r < 0.331;
      v_cert    := r < 0.286;

      if    v_cert    then v_stage := 'complete';
      elsif v_booth   then v_stage := 'booth';
      elsif v_stage_d then v_stage := 'stage-done';
      elsif v_checked and r < 0.562 then v_stage := 'waiting';
      elsif v_checked then v_stage := 'checked-in';
      else  v_stage := 'registered';
      end if;

      if serial_no % 683 = 0 then v_stage := 'on-stage'; end if;

      insert into public.students (
        reg_no, name, dept_code, cgpa, phone, hue, stage, qr_issued,
        attendance, checked_in_at, stage_done, booth_done, lunch_done,
        certificate_done, photo_count
      ) values (
        'CEK22' || code || lpad(i::text, 3, '0'),
        full_name,
        code,
        round((6.4 + random() * 3.5)::numeric, 2),
        '+91 ' || (90000 + floor(random()*9999)::int) || ' ' || (10000 + floor(random()*89999)::int),
        (abs(hashtext(full_name || code || i::text)) % 360),
        v_stage,
        random() < 0.966,
        v_checked,
        case when v_checked
             then date_trunc('day', now()) + make_interval(hours => 8 + floor(random()*4)::int,
                                                           mins  => floor(random()*60)::int)
             else null end,
        v_stage_d, v_booth, v_lunch, v_cert,
        case when v_booth then 3 + floor(random()*9)::int
             when v_stage_d then 1 + floor(random()*2)::int
             else 0 end
      );
    end loop;
  end loop;
end $$;
