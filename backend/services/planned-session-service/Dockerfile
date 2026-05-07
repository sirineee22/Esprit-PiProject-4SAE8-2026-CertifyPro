# ============================================
# Stage 1: Build the Spring Boot application
# ============================================
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy Maven config first for cache optimization
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build jar
RUN mvn clean package -DskipTests -B


# ============================================
# Stage 2: Run lightweight container
# ============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy built jar from stage 1
COPY --from=build /app/target/*.jar app.jar

# Expose your Spring Boot port
EXPOSE 8084

# Start application
ENTRYPOINT ["java","-jar","app.jar"]
