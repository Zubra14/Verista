-- Allow minimal public vehicle data
CREATE POLICY "Allow minimal public vehicle data" ON vehicles
FOR SELECT
TO public
USING (true);

-- Parents can view their children's data
CREATE POLICY "Parents can view their children's data" ON students
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE (profiles.id = auth.uid()) AND (profiles.role = 'parent'::text) AND (students.parent_id = profiles.id)));

-- Government users can view all transportation data
CREATE POLICY "Government users can view all transportation data" ON trips
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles profiles_1 WHERE (profiles_1.id = auth.uid()) AND (profiles_1.role = 'government'::text)));

-- Allow public read access
CREATE POLICY "Allow public read access" ON profiles
FOR SELECT
TO public
USING (true);

-- Parents can view their own profile
CREATE POLICY "Parents can view their own profile" ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Drivers can view their own profile
CREATE POLICY "Drivers can view their own profile" ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Schools can view their own profile
CREATE POLICY "Schools can view their own profile" ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Government can view all profiles
CREATE POLICY "Government can view all profiles" ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" ON profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Schools can view their own routes
CREATE POLICY "Schools can view their own routes" ON routes
FOR SELECT
TO authenticated
USING (school_id = auth.uid());

-- Schools can insert their own routes
CREATE POLICY "Schools can insert their own routes" ON routes
FOR INSERT
TO authenticated
WITH CHECK (school_id = auth.uid());

-- Schools can update their own routes
CREATE POLICY "Schools can update their own routes" ON routes
FOR UPDATE
TO authenticated
USING (school_id = auth.uid())
WITH CHECK (school_id = auth.uid());

-- Schools can delete their own routes
CREATE POLICY "Schools can delete their own routes" ON routes
FOR DELETE
TO authenticated
USING (school_id = auth.uid());

-- Drivers can view their own trips
CREATE POLICY "Drivers can view their own trips" ON trips
FOR SELECT
TO authenticated
USING (driver_id = auth.uid());

-- Schools can view all trips
CREATE POLICY "Schools can view all trips" ON trips
FOR SELECT
TO authenticated
USING (true);

-- Drivers can insert their own trips
CREATE POLICY "Drivers can insert their own trips" ON trips
FOR INSERT
TO authenticated
WITH CHECK (driver_id = auth.uid());

-- Drivers can update their own trips
CREATE POLICY "Drivers can update their own trips" ON trips
FOR UPDATE
TO authenticated
USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid());

-- Drivers can delete their own trips
CREATE POLICY "Drivers can delete their own trips" ON trips
FOR DELETE
TO authenticated
USING (driver_id = auth.uid());

-- Government can view all alerts
CREATE POLICY "Government can view all alerts" ON alerts
FOR SELECT
TO authenticated
USING (true);

-- Drivers can view their own alerts
CREATE POLICY "Drivers can view their own alerts" ON alerts
FOR SELECT
TO authenticated
USING (trip_id IN (SELECT trips.id FROM trips WHERE (trips.driver_id = auth.uid())));

-- Drivers can insert their own alerts
CREATE POLICY "Drivers can insert their own alerts" ON alerts
FOR INSERT
TO authenticated
WITH CHECK (trip_id IN (SELECT trips.id FROM trips WHERE (trips.driver_id = auth.uid())));

-- Drivers can update their own alerts
CREATE POLICY "Drivers can update their own alerts" ON alerts
FOR UPDATE
TO authenticated
USING (trip_id IN (SELECT trips.id FROM trips WHERE (trips.driver_id = auth.uid())))
WITH CHECK (trip_id IN (SELECT trips.id FROM trips WHERE (trips.driver_id = auth.uid())));

-- Drivers can delete their own alerts
CREATE POLICY "Drivers can delete their own alerts" ON alerts
FOR DELETE
TO authenticated
USING (trip_id IN (SELECT trips.id FROM trips WHERE (trips.driver_id = auth.uid())));
