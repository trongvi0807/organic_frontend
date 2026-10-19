# Copy this file into the organic_backend root before using compose.app.yml.
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar ./app.jar
EXPOSE 8088
ENTRYPOINT ["java", "-jar", "app.jar"]
