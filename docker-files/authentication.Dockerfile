# Authentication Service Dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY authentication-service/pom.xml ./
RUN mvn dependency:go-offline -B

# Copy source code
COPY authentication-service/ ./

# Build the application
RUN mvn clean package -DskipTests

# Final stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR
COPY --from=builder /app/target/auth-service-1.0.0.jar app.jar

# Expose port
EXPOSE 3001

# Run the application
CMD ["java", "-jar", "app.jar"]